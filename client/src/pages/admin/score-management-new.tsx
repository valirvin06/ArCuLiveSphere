import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEvents } from '@/hooks/use-events';
import { useTeams } from '@/hooks/use-teams';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ScoreManagement = () => {
  const { toast } = useToast();
  const { data: events, isLoading: isEventsLoading } = useEvents();
  const { data: teams, isLoading: isTeamsLoading } = useTeams();
  
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [goldTeam, setGoldTeam] = useState<number | null>(null);
  const [silverTeam, setSilverTeam] = useState<number | null>(null);
  const [bronzeTeam, setBronzeTeam] = useState<number | null>(null);
  const [teamNonWinnerCounts, setTeamNonWinnerCounts] = useState<Record<number, number>>({});
  const [noEntries, setNoEntries] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isLoading = isEventsLoading || isTeamsLoading;
  
  // Get available teams
  const getAvailableTeams = () => {
    if (!teams) return [];
    return teams;
  };
  
  // Update non-winner count for a team
  const updateNonWinnerCount = (teamId: number, count: number) => {
    const newCounts = { ...teamNonWinnerCounts };
    
    // Ensure count is a valid number and at least 0
    const newCount = Math.max(0, isNaN(count) ? 0 : count);
    
    // If count is 0, remove the entry
    if (newCount === 0) {
      delete newCounts[teamId];
    } else {
      newCounts[teamId] = newCount;
    }
    
    setTeamNonWinnerCounts(newCounts);
  };
  
  // Toggle team in no entries
  const toggleNoEntry = (teamId: number) => {
    // If already in noEntries, remove it
    if (noEntries.includes(teamId)) {
      setNoEntries(noEntries.filter(id => id !== teamId));
    } else {
      // Remove from non-winners if present
      const newCounts = { ...teamNonWinnerCounts };
      delete newCounts[teamId];
      setTeamNonWinnerCounts(newCounts);
      
      // Add to no entries
      setNoEntries([...noEntries, teamId]);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedEvent) {
      toast({
        title: "Error",
        description: "Please select an event",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get score settings for point values
      const settingsResponse = await fetch('/api/score-settings');
      const settings = await settingsResponse.json();
      
      const medals = [];
      
      // Add gold medal
      if (goldTeam) {
        medals.push({
          eventId: selectedEvent,
          teamId: goldTeam,
          medalType: 'GOLD',
          points: settings.goldPoints
        });
      }
      
      // Add silver medal
      if (silverTeam) {
        medals.push({
          eventId: selectedEvent,
          teamId: silverTeam,
          medalType: 'SILVER',
          points: settings.silverPoints
        });
      }
      
      // Add bronze medal
      if (bronzeTeam) {
        medals.push({
          eventId: selectedEvent,
          teamId: bronzeTeam,
          medalType: 'BRONZE',
          points: settings.bronzePoints
        });
      }
      
      // Add non-winners based on counts
      Object.entries(teamNonWinnerCounts).forEach(([teamIdStr, count]) => {
        const teamId = parseInt(teamIdStr);
        // Create multiple non-winner entries based on count
        for (let i = 0; i < count; i++) {
          medals.push({
            eventId: selectedEvent,
            teamId,
            medalType: 'NON_WINNER',
            points: settings.nonWinnerPoints
          });
        }
      });
      
      // Add no-entry teams
      for (const teamId of noEntries) {
        medals.push({
          eventId: selectedEvent,
          teamId,
          medalType: 'NO_ENTRY',
          points: 0 // No points for no-entry
        });
      }
      
      // Create medals one by one
      for (const medal of medals) {
        await apiRequest('POST', '/api/medals', medal);
      }
      
      // Update event status to completed
      await apiRequest('POST', '/api/events/' + selectedEvent, { status: 'COMPLETED' });
      
      // Reset form
      setSelectedEvent(null);
      setGoldTeam(null);
      setSilverTeam(null);
      setBronzeTeam(null);
      setTeamNonWinnerCounts({});
      setNoEntries([]);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/medals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scoreboard'] });
      
      toast({
        title: "Success",
        description: "Results saved successfully"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save results",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate total non-winners and points
  const totalNonWinners = Object.values(teamNonWinnerCounts).reduce((sum, count) => sum + count, 0);
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-montserrat font-semibold mb-6 text-[#000080]">Score Management</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 text-[#000080] animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label htmlFor="event-select" className="block mb-2 text-sm font-medium text-gray-700">Select Event</label>
              <Select
                value={selectedEvent?.toString()}
                onValueChange={(value) => {
                  setSelectedEvent(parseInt(value));
                  // Reset team selections when event changes
                  setGoldTeam(null);
                  setSilverTeam(null);
                  setBronzeTeam(null);
                  setTeamNonWinnerCounts({});
                  setNoEntries([]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedEvent && (
              <form className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Medal Winners</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Gold Medal (1st Place)</label>
                    <Select
                      value={goldTeam?.toString()}
                      onValueChange={(value) => setGoldTeam(parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {getAvailableTeams().map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Silver Medal (2nd Place)</label>
                    <Select
                      value={silverTeam?.toString()}
                      onValueChange={(value) => setSilverTeam(parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {getAvailableTeams().map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Bronze Medal (3rd Place)</label>
                    <Select
                      value={bronzeTeam?.toString()}
                      onValueChange={(value) => setBronzeTeam(parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {getAvailableTeams().map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-8 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Team Participation</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    For each team, enter the number of non-winner participants (1 point each) or mark as "No Entry" (0 points).
                  </p>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team</TableHead>
                        <TableHead>Non-Winners (1pt each)</TableHead>
                        <TableHead>No Entry (0pts)</TableHead>
                        <TableHead>Total Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getAvailableTeams().map((team) => {
                        const nonWinnerCount = teamNonWinnerCounts[team.id] || 0;
                        const isNoEntry = noEntries.includes(team.id);
                        const isMedalWinner = goldTeam === team.id || silverTeam === team.id || bronzeTeam === team.id;
                        
                        // Calculate points for this team
                        let points = nonWinnerCount; // 1 point per non-winner
                        if (goldTeam === team.id) points += 10; // Gold medal points
                        if (silverTeam === team.id) points += 7; // Silver medal points
                        if (bronzeTeam === team.id) points += 5; // Bronze medal points
                        if (isNoEntry) points = 0; // No entry = 0 points
                        
                        return (
                          <TableRow key={team.id}>
                            <TableCell className="font-medium">
                              {team.name}
                              {isMedalWinner && (
                                <div className="mt-1">
                                  {goldTeam === team.id && <Badge className="mr-1 bg-yellow-400 text-black">Gold</Badge>}
                                  {silverTeam === team.id && <Badge className="mr-1 bg-gray-300 text-black">Silver</Badge>}
                                  {bronzeTeam === team.id && <Badge className="mr-1 bg-amber-700 text-white">Bronze</Badge>}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={nonWinnerCount || ""}
                                onChange={(e) => {
                                  if (isNoEntry) {
                                    // If team is marked as No Entry, unmark it first
                                    setNoEntries(noEntries.filter(id => id !== team.id));
                                  }
                                  updateNonWinnerCount(team.id, parseInt(e.target.value) || 0);
                                }}
                                className="w-20"
                                disabled={isNoEntry}
                              />
                            </TableCell>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={isNoEntry}
                                onChange={() => toggleNoEntry(team.id)}
                                className="w-4 h-4"
                              />
                            </TableCell>
                            <TableCell>
                              <Badge variant={points > 0 ? "default" : "outline"} className={points > 0 ? "bg-[#000080]" : "text-gray-500"}>
                                {points} pts
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  <div className="mt-4 text-sm text-gray-700">
                    <p><strong>Total Non-Winners:</strong> {totalNonWinners} ({totalNonWinners} points)</p>
                    <p><strong>Total Teams with No Entry:</strong> {noEntries.length} (0 points)</p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-2"
                    onClick={() => {
                      setSelectedEvent(null);
                      setGoldTeam(null);
                      setSilverTeam(null);
                      setBronzeTeam(null);
                      setTeamNonWinnerCounts({});
                      setNoEntries([]);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#000080] hover:bg-opacity-90"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Results"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ScoreManagement;