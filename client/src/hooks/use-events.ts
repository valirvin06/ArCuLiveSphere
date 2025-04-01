import { useQuery } from "@tanstack/react-query";

export type Event = {
  id: number;
  name: string;
  categoryId: number;
  eventDate?: string;
  status: string;
};

export type EventResult = {
  id: number;
  name: string;
  category: string;
  categoryId: number;
  eventDate?: string;
  status: string;
  goldTeam?: { id: number; name: string };
  silverTeam?: { id: number; name: string };
  bronzeTeam?: { id: number; name: string };
};

export const useEvents = () => {
  return useQuery<Event[]>({
    queryKey: ['/api/events'],
  });
};

export const useEventResults = () => {
  return useQuery<EventResult[]>({
    queryKey: ['/api/events/results'],
  });
};
