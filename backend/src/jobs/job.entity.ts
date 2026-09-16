import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

@Entity()
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  type: string;

  @Column({ default: 'pending' })
  status: JobStatus;

  @CreateDateColumn()
  createdAt: Date;
}