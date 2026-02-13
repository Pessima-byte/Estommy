"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { activitiesAPI } from "@/lib/api";

const ActivityContext = createContext({
  activities: [] as any[],
  logActivity: async (activity: any) => { },
  refreshActivities: async () => { },
  loading: true,
  error: null as string | null,
});

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastActivityIdRef = useRef<string | null>(null);

  useEffect(() => {
    loadActivities();

    // Smart polling: Only refresh if there are new activities
    // Check every 5 seconds, but only fetch full list if there's a new activity
    const interval = setInterval(async () => {
      try {
        // Quick check: fetch just the latest activity
        const response = await fetch('/api/activities?limit=1');
        if (response.ok) {
          const latestActivities = await response.json();
          if (latestActivities.length > 0) {
            const latestId = latestActivities[0].id;
            // Only refresh if we have a new activity
            if (lastActivityIdRef.current !== latestId) {
              await loadActivities();
            }
          }
        }
      } catch (err) {
        // Silently fail - don't spam errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  async function loadActivities(limit = 50) {
    try {
      setLoading(true);
      setError(null);
      const data = await activitiesAPI.getAll(limit) as any[];
      setActivities(data);
      // Update the last activity ID we've seen
      if (data.length > 0) {
        lastActivityIdRef.current = data[0].id;
      }
    } catch (err: any) {
      // Silently fail - activities are optional, don't break the app
      console.error('[ActivityContext] Error loading activities:', err);
      setActivities([]); // Set empty array on error
      // Don't set error state - activities are optional
    } finally {
      setLoading(false);
    }
  }

  async function logActivity(activity: any) {
    try {
      setError(null);
      await activitiesAPI.create(activity);
      // Immediately refresh to show the new activity
      await loadActivities();
    } catch (err: any) {
      console.error('Error logging activity:', err);
      // Don't throw - activity logging shouldn't break the app
    }
  }

  return (
    <ActivityContext.Provider value={{ activities, logActivity, refreshActivities: loadActivities, loading, error }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  return useContext(ActivityContext);
}
