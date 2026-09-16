import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity';
import { CreateJobDto } from './dto/create-job.dto';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['running'],
  running: ['completed', 'failed'],
  completed: [],
  failed: [],
};

@Injectable()
export class JobsService {
  constructor(@InjectRepository(Job) private repo: Repository<Job>) {}

  create(dto: CreateJobDto) {
    const job = this.repo.create(dto);
    return this.repo.save(job);
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async remove(id: string) {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Job not found');
    return { deleted: true };
  }

  async updateStatus(id: string, newStatus: string) {
    const job = await this.repo.findOneBy({ id });
    if (!job) throw new NotFoundException('Job not found');
  
    const allowed = VALID_TRANSITIONS[job.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${job.status} to ${newStatus}`,
      );
    }
    const result = await this.repo
      .createQueryBuilder()
      .update(Job)
      .set({ status: newStatus as any })
      .where('id = :id AND status = :current', { id, current: job.status })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException('Job status was changed by another request');
    }

    return this.repo.findOneBy({ id });
  }
}