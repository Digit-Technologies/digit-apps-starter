import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { AppErrorAlert, Globe, PropertyGrid, Section, useBackendQuery } from '@heysutton/sdk-react';

type WeatherData = {
  latitude: number;
  longitude: number;
  temperatureF: number | null;
  weatherCode: number | null;
  observedAt: string | null;
};

const none = (
  <Typography variant="body1" color="text.tertiary" component="span">
    None
  </Typography>
);

export default function PublicApiPanel() {
  // The Worker calls Open-Meteo; the browser only talks to /proxy/backend/weather.
  const { data, error, loading, refetch } = useBackendQuery<WeatherData>({
    path: '/weather',
    skip: true,
  });

  return (
    <Section
      title="Public API"
      subtitle="The Worker calls Open-Meteo for New York. No API key needed."
      subtitlePlacement="below"
      actions={
        <Button
          startIcon={<Globe />}
          loading={loading}
          loadingPosition="start"
          onClick={() => void refetch()}
        >
          Fetch weather
        </Button>
      }
    >
      {error && <AppErrorAlert error={error} onRetry={() => void refetch()} />}
      <PropertyGrid
        rows={[
          {
            label: 'Temperature',
            value: data?.temperatureF != null ? `${data.temperatureF.toFixed(1)}°F` : none,
          },
          { label: 'Weather code', value: data?.weatherCode != null ? data.weatherCode : none },
          { label: 'Observed', value: data?.observedAt ?? none },
          { label: 'Location', value: data ? `${data.latitude}, ${data.longitude}` : none },
        ]}
      />
    </Section>
  );
}
