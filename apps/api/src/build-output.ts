import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

export async function buildAndPromote(
  outputDirectory: string,
  build: (stagingDirectory: string) => Promise<void>,
  stagingParentDirectory = dirname(outputDirectory),
  hooks: { commit?: () => Promise<void>; rollback?: () => Promise<void>; renamePath?: typeof rename } = {},
): Promise<void> {
  const outputName = basename(outputDirectory);
  const stagingDirectory = join(stagingParentDirectory, `.${outputName}.staging-${randomUUID()}`);
  const backupDirectory = join(stagingParentDirectory, `.${outputName}.backup-${randomUUID()}`);
  let hasBackup = false;
  let committed = false;
  let promotionHandled = false;
  const renamePath = hooks.renamePath ?? rename;
  const rollbackCommit = async () => {
    if (!committed || !hooks.rollback) return;
    await hooks.rollback();
    committed = false;
  };

  await mkdir(stagingParentDirectory, { recursive: true });

  try {
    await build(stagingDirectory);

    // Commit related metadata only after the staged site is complete. If output
    // promotion then fails, restore that metadata together with the old output.
    if (hooks.commit) {
      await hooks.commit();
      committed = true;
    }

    try {
      await renamePath(outputDirectory, backupDirectory);
      hasBackup = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    try {
      await renamePath(stagingDirectory, outputDirectory);
    } catch (promotionError) {
      const failures: unknown[] = [promotionError];
      if (hasBackup) {
        try {
          await renamePath(backupDirectory, outputDirectory);
        } catch (restoreError) {
          failures.push(restoreError);
        }
      }
      try {
        await rollbackCommit();
      } catch (rollbackError) {
        failures.push(rollbackError);
      }
      promotionHandled = true;
      if (failures.length > 1) {
        throw new AggregateError(failures, `Could not promote the new site or fully restore the previous state at ${outputDirectory}`);
      }
      throw promotionError;
    }

    if (hasBackup) {
      await rm(backupDirectory, { recursive: true, force: true }).catch((error: unknown) => {
        console.warn(`New site is ready, but old build cleanup failed at ${backupDirectory}`, error);
      });
    }
  } catch (error) {
    // A failure while moving the old directory aside happens after commit too.
    if (committed && !promotionHandled) {
      try {
        await rollbackCommit();
      } catch (rollbackError) {
        throw new AggregateError([error, rollbackError], `Could not promote the new site or roll back committed metadata for ${outputDirectory}`);
      }
    }
    throw error;
  } finally {
    await rm(stagingDirectory, { recursive: true, force: true });
  }
}
