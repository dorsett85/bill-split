import { Bill, BillModel } from '../../models/BillModel.ts';
import { FileStorageService } from '../types/fileStorageService.ts';
import { ServerRequest } from '../types/requestHandler.ts';

export class BillService {
  private billModel: BillModel;
  private fileStorageService: FileStorageService;

  constructor(billMode: BillModel, fileStorageService: FileStorageService) {
    this.billModel = billMode;
    this.fileStorageService = fileStorageService;
  }

  public async read(id: string): Promise<Bill> {
    const { rows } = await this.billModel.read(id);
    return rows[0];
  }

  /**
   * This method is a little unusual. Normally we wouldn't use the request
   * object at this layer, but it's required for our file storage service. So
   * we're both storing the bill image here and creating a new bill record in
   * our db.
   */
  public async create(req: ServerRequest): Promise<Bill> {
    const storedFiles = await this.fileStorageService.store(req);
    const result = await this.billModel.create({
      image_path: storedFiles[0].path,
      image_status: 'parsing',
    });
    return result.rows[0];
  }
}
