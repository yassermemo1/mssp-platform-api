import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientTeamAssignment } from './entities/client-team-assignment.entity';

/**
 * Team Assignments Module
 * Handles assignment of internal team members to clients with specific roles
 * Provides role-based access control and responsibility tracking
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ClientTeamAssignment]),
  ],
  controllers: [
    // Future: TeamAssignmentsController
  ],
  providers: [
    // Future: TeamAssignmentsService
  ],
  exports: [
    TypeOrmModule,
    // Future: TeamAssignmentsService
  ],
})
export class TeamAssignmentsModule {} 