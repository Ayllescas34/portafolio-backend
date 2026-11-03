import { Module } from '@nestjs/common';
import { SkillCategoriesController, SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

@Module({ controllers: [SkillCategoriesController, SkillsController], providers: [SkillsService] })
export class SkillsModule {}
