import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('mediums')
export class Medium {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // Display name: "Sinhala", "English", "Tamil", etc.

  @Column({ unique: true })
  normalizedName: string; // Folder name: "sinhala", "english", "tamil", etc.

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

