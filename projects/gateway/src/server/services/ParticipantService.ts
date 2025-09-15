import type { ParticipantDao } from '../dao/ParticipantDao.ts';
import type { IdRecord } from '../dto/id.ts';
import type {
  ParticipantCreate,
  ParticipantRead,
  ParticipantSearch,
} from '../dto/participant.ts';

interface ParticipantServiceConstructor {
  participantDao: ParticipantDao;
}

export class ParticipantService {
  private participantDao: ParticipantDao;

  constructor({ participantDao }: ParticipantServiceConstructor) {
    this.participantDao = participantDao;
  }

  public async create(participant: ParticipantCreate): Promise<IdRecord> {
    return this.participantDao.create(participant);
  }

  public async search(
    searchParams: ParticipantSearch,
  ): Promise<ParticipantRead[]> {
    return this.participantDao.search(searchParams);
  }
}
