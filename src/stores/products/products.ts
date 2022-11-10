import { config } from '/src/services/config';

export const getAvailableProducts = async (
  externalId: string,
  gender: GenderKey,
  ageGroup: AgeKey,
) => {
  const response = await fetch('/fit_engine/shoes/', {
    body: JSON.stringify({
      external_id:           externalId,
      gender,
      age_group:             ageGroup,
      fallback_chart_locale: config.chartLocale,
      fallback_chart_name:   config.chartName,
    }),
    method:  'POST',
    headers: { 'Content-type': 'application/json' },
  });
  const json = await response.json();
  return json.shoe_styles;
};
