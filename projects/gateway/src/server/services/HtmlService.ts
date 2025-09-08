import type { StaticAssets } from '../types/staticAssets.ts';
import type { StaticFileService } from '../types/staticFileService.ts';

/**
 * Data that gets passed to the index.server.tsx render function
 */
type RenderHtmlInput = {
  staticAssets: StaticAssets;
  data?: unknown;
};

type RenderHtmlModule = {
  render: (input: RenderHtmlInput) => string;
};

export type LoadSSRModuleFunction = (keys: {
  ssrJs: string;
  route: string;
}) => Promise<RenderHtmlModule> | RenderHtmlModule;

interface HtmlServiceConstructor {
  staticFileService: StaticFileService;
  loadSSRModule: LoadSSRModuleFunction;
}

/**
 * This class will collect all resources for a page and render them to html
 */
export class HtmlService {
  private readonly staticFileService: StaticFileService;
  private readonly loadSSRModule: LoadSSRModuleFunction;

  public constructor({
    staticFileService,
    loadSSRModule,
  }: HtmlServiceConstructor) {
    this.staticFileService = staticFileService;
    this.loadSSRModule = loadSSRModule;
  }

  public async render(route: string, data?: unknown): Promise<string> {
    const assets = await this.staticFileService.getAssets(route);

    const { render } = await this.loadSSRModule({
      route,
      ssrJs: assets.ssrJs,
    });

    return render({ staticAssets: assets.static, data });
  }
}
