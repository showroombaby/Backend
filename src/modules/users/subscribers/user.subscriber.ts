import { Logger } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  LoadEvent,
} from 'typeorm';
import { User } from '../entities/user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  private readonly logger = new Logger(UserSubscriber.name);

  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async beforeInsert(event: InsertEvent<User>) {
    this.logger.debug('Avant insertion utilisateur');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  afterLoad(entity: User, event?: LoadEvent<User>) {
    this.logger.debug(`Utilisateur chargé : ${entity.id}`);
  }
}
