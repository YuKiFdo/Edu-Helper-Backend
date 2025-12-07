import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfController } from './controllers/pdf.controller';
import { UserController } from './controllers/user.controller';
import { AdminController } from './controllers/admin.controller';
import { PdfDbService } from './services/pdf-db.service';
import { Grade } from './entities/grade.entity';
import { Subject } from './entities/subject.entity';
import { Medium } from './entities/medium.entity';
import { Pdf } from './entities/pdf.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, Subject, Medium, Pdf])],
  controllers: [
    PdfController,
    UserController,
    AdminController,
  ],
  providers: [PdfDbService],
  exports: [PdfDbService],
})
export class PdfModule {}

