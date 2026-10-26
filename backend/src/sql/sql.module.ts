import { Module } from '@nestjs/common';
import { SqlService } from './sql.service.js';

@Module({
  providers: [SqlService],
  exports: [SqlService],
})
export class SqlModule {}
