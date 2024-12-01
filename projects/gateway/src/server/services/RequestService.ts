import { StaticFileService } from '../types/staticFileService.ts';
import { IncomingMessage, ServerResponse } from 'node:http';
import { RequestContext, ServerRequest } from '../types/requestHandler.ts';
import { FileStorageService } from '../types/fileStorageService.ts';
import { BillService } from './BillService.ts';
import { BillModel } from '../models/BillModel.ts';
import { getDb } from './getDb.ts';
import { resolveRoute } from './resolveRoute.ts';
import { routes } from '../routes/routes.tsx';
import { KafkaService } from './KafkaService.ts';

interface RequestServiceConstructorInput {
  fileStorageService: FileStorageService;
  staticFileService: StaticFileService;
}

export class RequestService {
  private readonly fileStorageService: FileStorageService;
  private readonly staticFileService: StaticFileService;

  public constructor({
    fileStorageService,
    staticFileService,
  }: RequestServiceConstructorInput) {
    this.fileStorageService = fileStorageService;
    this.staticFileService = staticFileService;
  }

  /**
   * Gatekeeper handler for all requests
   */
  public handleRequest = async (
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<ServerResponse> => {
    if (!req.url) {
      res.statusCode = 400;
      return res.end('You need to specify a url in your request');
    }

    const route = resolveRoute(req.url, Object.keys(routes));
    const requestHandler = route && routes[route];

    if (!requestHandler) {
      // Fall through case
      res.statusCode = 404;
      return res.end('We were unable to find the resource you requested');
    }

    const serverRequest: ServerRequest = Object.assign(req, { url: req.url });

    // TODO make a function to create context
    const context: RequestContext = {
      billService: new BillService({
        billModel: new BillModel(getDb()),
        fileStorageService: this.fileStorageService,
        kafkaService: new KafkaService(),
      }),
      staticFileService: this.staticFileService,
    };

    try {
      return requestHandler(serverRequest, res, context);
    } catch (e) {
      console.log(e);
      res.statusCode = 500;
      // based on the context request we could send back different response
      // types. For instance if they requested html we could send back a html
      // error page, or a json object if the request was for json data.
      return res.end(
        'We experienced an unexpected issue, please try again later',
      );
    }
  };
}
