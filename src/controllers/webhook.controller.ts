import { Merchant, MerchantWebhook, StellarWebhookPayload, WebhookPayload } from "../interfaces/webhook.interfaces";
import { MerchantAuthService } from "../services/merchant.service";
import { WebhookService } from "../services/webhook.service";
import { Request, Response } from 'express'

const webhookService = new WebhookService();

export class WebhookController {

    async handleWebhook (
        req: Request, res: Response
    ) {
        const response = res
        try {
            const { payload }: StellarWebhookPayload = req.body

            const merchant: Merchant | null = await MerchantAuthService.getMerchantById(payload.customer.id)
            if (!merchant) return
            const merchantWebhook: MerchantWebhook | null = await WebhookService.getMerchantWebhook(merchant.id)
            if (!merchantWebhook) return
            const webhookPayload: WebhookPayload = {
                transactionId: payload.transaction.id,
                transactionType: payload.transaction.type,
                status: payload.transaction.status,
                amount: payload.transaction.amount_in?.amount,
                asset: payload.transaction.amount_in?.asset,
                merchantId: payload.customer.id,
                timestamp: (new Date()).toISOString(),
                eventType: `${payload.transaction.type}.${payload.transaction.status}`,
            }
            // webhookService.notifyPaymentUpdate(merchantWebhook, webhookPayload)
            webhookService.notifyWithRetry(merchantWebhook, webhookPayload)
        } catch (err) {
            console.error("Webhook error: ", err);
            return res.status(500).json({error: "Webhook error"})
        }
    }
}