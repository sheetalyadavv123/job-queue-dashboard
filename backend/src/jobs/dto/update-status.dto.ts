import { IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['pending', 'running', 'completed', 'failed'])
  status: 'pending' | 'running' | 'completed' | 'failed';
}