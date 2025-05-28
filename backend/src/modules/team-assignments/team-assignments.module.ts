import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientTeamAssignment } from './entities/client-team-assignment.entity';
import { User } from '../../entities/user.entity';
import { Client } from '../../entities/client.entity';
import { TeamAssignmentsService } from './team-assignments.service';
import { TeamAssignmentsController } from './team-assignments.controller';

/**
 * Team Assignments Module
 * Handles assignment of internal team members to clients with specific roles
 * Provides role-based access control and responsibility tracking
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ClientTeamAssignment, User, Client]),
  ],
  controllers: [TeamAssignmentsController],
  providers: [TeamAssignmentsService],
  exports: [
    TypeOrmModule,
    TeamAssignmentsService,
  ],
})
export class TeamAssignmentsModule {} 