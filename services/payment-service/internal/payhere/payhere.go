package payhere

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"strings"
)

// Config holds PayHere merchant credentials. Checkout is disabled until the
// merchant account is provisioned; the hash helpers below implement the
// PayHere checkout signature spec so wiring the hosted checkout later only
// needs credentials and a frontend redirect.
type Config struct {
	MerchantID     string
	MerchantSecret string
	NotifyURL      string
}

func (c Config) Enabled() bool {
	return c.MerchantID != "" && c.MerchantSecret != ""
}

// CheckoutHash computes the hash PayHere requires on checkout requests:
// md5(merchant_id + order_id + amount + currency + md5(merchant_secret)).
func (c Config) CheckoutHash(orderID string, amount string, currency string) string {
	secretHash := md5Upper(c.MerchantSecret)
	return md5Upper(c.MerchantID + orderID + amount + currency + secretHash)
}

// VerifyNotification validates the md5sig on a PayHere server-to-server
// payment notification.
func (c Config) VerifyNotification(merchantID, orderID, amount, currency, statusCode, md5sig string) bool {
	secretHash := md5Upper(c.MerchantSecret)
	expected := md5Upper(merchantID + orderID + amount + currency + statusCode + secretHash)
	return strings.EqualFold(expected, md5sig)
}

func md5Upper(s string) string {
	sum := md5.Sum([]byte(s))
	return strings.ToUpper(hex.EncodeToString(sum[:]))
}

// Amount formats a price the way PayHere expects (2 decimal places).
func Amount(v float64) string {
	return fmt.Sprintf("%.2f", v)
}
