/**
 * Cola de una sola ejecución para revalidaciones.
 * - Eventos simultáneos con la misma clave comparten la promesa activa.
 * - Si cambia la clave durante una ejecución, conserva solo el trabajo más reciente.
 */
export function createSingleFlightQueue(worker) {
  let activePromise = null;
  let activeKey = null;
  let pendingJob = null;

  const enqueue = (job) => {
    if (activePromise) {
      if (job.key !== activeKey && job.key !== pendingJob?.key) {
        pendingJob = job;
      }
      return activePromise;
    }

    activePromise = (async () => {
      let currentJob = job;
      let result;

      while (currentJob) {
        activeKey = currentJob.key;
        result = await worker(currentJob);
        currentJob = pendingJob;
        pendingJob = null;
      }

      return result;
    })().finally(() => {
      activePromise = null;
      activeKey = null;
      pendingJob = null;
    });

    return activePromise;
  };

  return { enqueue };
}

export default createSingleFlightQueue;
