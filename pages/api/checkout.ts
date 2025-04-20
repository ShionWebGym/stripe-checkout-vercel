// pages/api/checkout.ts

import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// 日本語名で受け取って対応する price_id を設定
const PRODUCTS: Record<string, string> = {
    プランA: 'prod_S9og5PMvl9k8sY',
    プランB: 'prod_S9ogSup7UVv4Sk',
    プランC: 'prod_S9ogixb9LpvtFq',
    オプションA: 'prod_S9ohyDhj64SlXd',
    オプションB: 'prod_S9ohxmrx632nP2',
    オプションC: 'prod_S9oi1l2cyoWfrq',
}

// NOTE: 上記は "product ID"。Checkoutには price ID が必要。
// 商品を複数価格で出しているなら price_*** を渡す必要あり。
const PRICES: Record<string, string> = {
    プランA: 'price_XXXA',
    プランB: 'price_XXXB',
    プランC: 'price_XXXC',
    オプションA: 'price_OPTA',
    オプションB: 'price_OPTB',
    オプションC: 'price_OPTC',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { plan, option } = req.query

    if (req.method !== 'GET') return res.status(405).end('Method not allowed')

    try {
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = []

        // プラン
        if (typeof plan === 'string' && PRICES[plan]) {
            line_items.push({ price: PRICES[plan], quantity: 1 })
        }

        // オプション（カンマ区切り）
        if (typeof option === 'string') {
            const options = option.split(',').map(o => o.trim())
            options.forEach(opt => {
                if (PRICES[opt]) {
                    line_items.push({ price: PRICES[opt], quantity: 1 })
                }
            })
        }

        // チェックアウトセッション作成
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items,
            success_url: 'https://stripe-checkout-vercel.vercel.app/success',
            cancel_url: 'https://stripe-checkout-vercel.vercel.app/cancel',
        })

        // リダイレクト
        res.redirect(303, session.url!)
    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: '内部エラー', message: err.message })
    }
}
