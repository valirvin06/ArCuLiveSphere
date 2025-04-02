import * as cron from 'node-cron';
import { db } from './db';

// Example cron job that runs every day at midnight
export const dailyCleanupJob = cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running daily cleanup job...');
    // Add your cleanup logic here
    // For example: cleanup old sessions, temporary files, etc.
  } catch (error) {
    console.error('Error in daily cleanup job:', error);
  }
});

// Example cron job that runs every hour
export const hourlyMaintenanceJob = cron.schedule('0 * * * *', async () => {
  try {
    console.log('Running hourly maintenance job...');
    // Add your maintenance logic here
    // For example: database maintenance, cache cleanup, etc.
  } catch (error) {
    console.error('Error in hourly maintenance job:', error);
  }
});

// Example cron job that runs every 15 minutes
export const frequentCheckJob = cron.schedule('*/15 * * * *', async () => {
  try {
    console.log('Running frequent check job...');
    // Add your frequent check logic here
    // For example: check system health, monitor resources, etc.
  } catch (error) {
    console.error('Error in frequent check job:', error);
  }
});

// Function to start all cron jobs
export const startCronJobs = () => {
  dailyCleanupJob.start();
  hourlyMaintenanceJob.start();
  frequentCheckJob.start();
  console.log('All cron jobs started');
};

// Function to stop all cron jobs
export const stopCronJobs = () => {
  dailyCleanupJob.stop();
  hourlyMaintenanceJob.stop();
  frequentCheckJob.stop();
  console.log('All cron jobs stopped');
}; 