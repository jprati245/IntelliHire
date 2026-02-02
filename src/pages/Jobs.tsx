import { AppLayout } from '@/components/layout/AppLayout';
import { JobRecommendations } from '@/components/jobs/JobRecommendations';

export default function Jobs() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Job Recommendations
          </h1>
          <p className="text-muted-foreground">
            AI-powered job matching based on your skills, scores, and preferences.
          </p>
        </div>
        <JobRecommendations />
      </div>
    </AppLayout>
  );
}
