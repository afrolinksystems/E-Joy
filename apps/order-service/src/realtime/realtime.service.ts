import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

export const REALTIME_TOPICS = {
  serviceTicketUpdated: 'serviceTicketUpdated',
  printJobUpdated: 'printJobUpdated',
} as const;

@Injectable()
export class RealtimeService {
  private readonly pubSub = new PubSub();

  publishServiceTicketUpdated(payload: unknown): Promise<void> {
    return this.pubSub.publish(REALTIME_TOPICS.serviceTicketUpdated, {
      serviceTicketUpdated: payload,
    });
  }

  publishPrintJobUpdated(payload: unknown): Promise<void> {
    return this.pubSub.publish(REALTIME_TOPICS.printJobUpdated, {
      printJobUpdated: payload,
    });
  }

  asyncIterator(topic: (typeof REALTIME_TOPICS)[keyof typeof REALTIME_TOPICS]) {
    return this.pubSub.asyncIterableIterator(topic);
  }
}
