import midtransClient from 'midtrans-client'
import 'dotenv/config'

const coreApi = new midtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
})

export default coreApi