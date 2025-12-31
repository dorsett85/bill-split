export const USCurrency = Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
});

export const USPercent = Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 2,
});
