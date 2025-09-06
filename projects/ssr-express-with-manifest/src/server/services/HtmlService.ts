import type { StaticAssets } from '../types/staticAssets.ts';
import type { StaticFileService } from '../types/staticFileService.ts';

type RenderHtmlInput = {
  staticAssets: StaticAssets;
  data?: unknown;
};

type RenderHtmlModule = {
  render: (input: RenderHtmlInput) => string;
};

export type LoadRenderModuleFunction = (keys: {
  serverJs: string;
  resolvedRoute: string;
}) => Promise<RenderHtmlModule> | RenderHtmlModule;

interface HtmlServiceConstructor {
  staticFileService: StaticFileService;
  loadRenderModule: LoadRenderModuleFunction;
}

export class HtmlService {
  private readonly staticFileService: StaticFileService;
  private readonly loadRenderModule: LoadRenderModuleFunction;

  public constructor({
    staticFileService,
    loadRenderModule,
  }: HtmlServiceConstructor) {
    this.staticFileService = staticFileService;
    this.loadRenderModule = loadRenderModule;
  }

  public async render(urlPattern: string): Promise<string> {
    const assets = await this.staticFileService.getAssets(urlPattern);

    const { render } = await this.loadRenderModule({
      resolvedRoute: urlPattern,
      serverJs: assets.serverJs,
    });

    return render({ staticAssets: assets.static });
  }
}
