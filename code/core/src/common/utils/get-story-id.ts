import type { Options, StoriesEntry } from '@storybook/core/types';
import { dedent } from 'ts-dedent';
import { normalizeStories, normalizeStoryPath } from '@storybook/core/common';
import path from 'node:path';
import { sanitize, storyNameFromExport, toId } from '@storybook/csf';
import { userOrAutoTitleFromSpecifier } from '@storybook/core/preview-api';
import { posix } from './posix';

interface StoryIdData {
  storyFilePath: string;
  exportedStoryName: string;
}

type GetStoryIdOptions = StoryIdData & {
  configDir: string;
  stories: StoriesEntry[];
  workingDir?: string;
  storyFilePath: string;
};

export async function getStoryId(data: StoryIdData, options: Options) {
  const stories = await options.presets.apply('stories', [], options);

  const autoTitle = getStoryTitle({
    ...data,
    stories,
    configDir: options.configDir,
  });

  if (autoTitle === undefined) {
    // eslint-disable-next-line local-rules/no-uncategorized-errors
    throw new Error(dedent`
    The new story file was successfully generated, but we are unable to index it. Please ensure that the new Story file is matched by the 'stories' glob pattern in your Storybook configuration.
    `);
  }

  const storyName = storyNameFromExport(data.exportedStoryName);

  const storyId = toId(autoTitle as string, storyName);
  const kind = sanitize(autoTitle);

  return { storyId, kind };
}

export function getStoryTitle({
  storyFilePath,
  configDir,
  stories,
  workingDir = process.cwd(),
}: Omit<GetStoryIdOptions, 'exportedStoryName'>) {
  const normalizedStories = normalizeStories(stories, {
    configDir,
    workingDir,
  });

  const relativePath = path.relative(workingDir, storyFilePath);
  const importPath = posix(normalizeStoryPath(relativePath));

  return normalizedStories
    .map((normalizeStory) => userOrAutoTitleFromSpecifier(importPath, normalizeStory))
    .filter(Boolean)[0];
}