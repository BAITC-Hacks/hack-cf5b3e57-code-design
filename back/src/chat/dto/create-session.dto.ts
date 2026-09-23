import { IsIn, IsOptional } from 'class-validator';

export type ChatMode = 'search' | 'bundle';
export type Locale = 'ru' | 'kk' | 'en';

const CHAT_MODES: ChatMode[] = ['search', 'bundle'];
const LOCALES: Locale[] = ['ru', 'kk', 'en'];

export class CreateSessionDto {
  @IsIn(CHAT_MODES)
  mode!: ChatMode;

  @IsOptional()
  @IsIn(LOCALES)
  locale?: Locale;
}
