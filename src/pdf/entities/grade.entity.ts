import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Pdf } from './pdf.entity';

@Entity('grades')
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // Display name: "Grade 01", "Advance Level", etc.

  @Column({ unique: true })
  normalizedName: string; // Folder name: "grade-01", "advance-level", etc.

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Pdf, (pdf) => pdf.grade)
  pdfs: Pdf[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

