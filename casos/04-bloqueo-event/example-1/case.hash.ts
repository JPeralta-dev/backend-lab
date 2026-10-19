import { workerData, parentPort} from "worker_threads";
import crypto from "bcryptjs"


const { password, salt } = workerData as { password: string, salt: number }

const hash = crypto.hashSync(password, salt)

parentPort?.postMessage(hash)
