import { Job } from '../types';

export type JobDeadlineStatus = 'active' | 'nearing' | 'expired';

export function getJobDeadlineStatus(job: Job): JobDeadlineStatus {
  if (job.status === 'closed') return 'expired';
  if (!job.deadline) return 'active';

  const deadlineDate = job.deadline.toDate ? job.deadline.toDate() : new Date(job.deadline);
  const now = new Date();

  if (deadlineDate < now) {
    return 'expired';
  }

  // Nearing deadline if within 3 days
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  if (deadlineDate <= threeDaysFromNow) {
    return 'nearing';
  }

  return 'active';
}
