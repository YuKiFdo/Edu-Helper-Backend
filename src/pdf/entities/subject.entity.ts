import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Pdf } from './pdf.entity';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Display name: "Mathematics", "Information Technology", etc.

  @Column({ unique: true })
  normalizedName: string; // Folder name: "mathematics", "information-technology", etc.

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Pdf, (pdf) => pdf.subject)
  pdfs: Pdf[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

