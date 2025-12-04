import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Grade } from './grade.entity';
import { Subject } from './subject.entity';

export enum PdfType {
  SYLLABUS = 'sylabus',
  PASTPAPERS = 'pastpapers',
}

@Entity('pdfs')
export class Pdf {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Custom display name set by user

  @Column()
  filename: string; // Actual filename on disk

  @Column()
  filePath: string; // Full path to file

  @Column({ type: 'enum', enum: PdfType })
  type: PdfType; // 'sylabus' or 'pastpapers'

  @Column({ type: 'bigint' })
  fileSize: number; // File size in bytes

  @Column()
  mimeType: string; // Should be 'application/pdf'

  @ManyToOne(() => Grade, { eager: true })
  @JoinColumn({ name: 'gradeId' })
  grade: Grade;

  @Column()
  gradeId: string;

  @ManyToOne(() => Subject, { eager: true })
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  @Column()
  subjectId: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  year: number; // Optional: year of the paper/syllabus

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

