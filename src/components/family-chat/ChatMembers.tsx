'use client';

/**
 * Chat Members Component
 *
 * Displays the list of chat members with their roles
 * and admin controls.
 */

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Users, MoreVertical, Shield, ShieldOff, VolumeX, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FamilyChatMemberWithProfile, FamilyChatRole } from '@/types/family-chat';

interface ChatMembersProps {
  members: FamilyChatMemberWithProfile[];
  currentUserId: string;
  isAdmin: boolean;
  onMute?: (userId: string, muted: boolean) => Promise<void>;
  onSetRole?: (userId: string, role: FamilyChatRole) => Promise<void>;
}

export function ChatMembers({
  members,
  currentUserId,
  isAdmin,
  onMute,
  onSetRole,
}: ChatMembersProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleMute = async (userId: string, muted: boolean) => {
    if (!onMute) return;
    setIsLoading(userId);
    try {
      await onMute(userId, muted);
    } finally {
      setIsLoading(null);
    }
  };

  const handleSetRole = async (userId: string, role: FamilyChatRole) => {
    if (!onSetRole) return;
    setIsLoading(userId);
    try {
      await onSetRole(userId, role);
    } finally {
      setIsLoading(null);
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    // Admins first
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    // Then by name
    const nameA = `${a.profile?.first_name} ${a.profile?.last_name}`;
    const nameB = `${b.profile?.first_name} ${b.profile?.last_name}`;
    return nameA.localeCompare(nameB);
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <Users className="h-5 w-5" />
          <span className="sr-only">View members</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({members.length})
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {sortedMembers.map((member) => {
            const name = member.profile
              ? `${member.profile.first_name} ${member.profile.last_name}`
              : 'Unknown';
            const initials = member.profile
              ? `${member.profile.first_name?.[0] || ''}${member.profile.last_name?.[0] || ''}`
              : '?';
            const isCurrentUser = member.user_id === currentUserId;
            const isMemberLoading = isLoading === member.user_id;

            return (
              <div
                key={member.id}
                className={cn(
                  'flex items-center justify-between rounded-lg p-2',
                  member.is_muted && 'opacity-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={member.profile?.avatar_url || undefined}
                      alt={name}
                    />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {name}
                        {isCurrentUser && (
                          <span className="ml-1 text-muted-foreground">(you)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role === 'admin' && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="mr-1 h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                      {member.is_muted && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          <VolumeX className="mr-1 h-3 w-3" />
                          Muted
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin controls */}
                {isAdmin && !isCurrentUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isMemberLoading}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Mute/Unmute */}
                      {member.is_muted ? (
                        <DropdownMenuItem
                          onClick={() => handleMute(member.user_id, false)}
                        >
                          <Volume2 className="mr-2 h-4 w-4" />
                          Unmute
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleMute(member.user_id, true)}
                        >
                          <VolumeX className="mr-2 h-4 w-4" />
                          Mute
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {/* Role change */}
                      {member.role === 'admin' ? (
                        <DropdownMenuItem
                          onClick={() => handleSetRole(member.user_id, 'member')}
                        >
                          <ShieldOff className="mr-2 h-4 w-4" />
                          Remove admin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleSetRole(member.user_id, 'admin')}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Make admin
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default ChatMembers;
