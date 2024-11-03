import { LocalStaticFileService } from '../services/LocalStaticFileService.ts';

const staticFileService = new LocalStaticFileService({
  staticDir: `${process.cwd()}/static`,
});
void staticFileService.populateFilenameCache();
