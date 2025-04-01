import { useQuery } from "@tanstack/react-query";

export type Team = {
  id: number;
  name: string;
  icon?: string;
  color?: string;
};

export const useTeams = () => {
  return useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });
};
