const DEFAULT_WEIGHT_OZ = 16;

const MASS_TO_OUNCES = new Map([
  ['oz', 1],
  ['ounce', 1],
  ['ounces', 1],
  ['lb', 16],
  ['lbs', 16],
  ['pound', 16],
  ['pounds', 16],
  ['g', 0.0352739619],
  ['gram', 0.0352739619],
  ['grams', 0.0352739619],
  ['kg', 35.2739619],
  ['kilogram', 35.2739619],
  ['kilograms', 35.2739619],
]);

const LENGTH_TO_INCHES = new Map([
  ['in', 1],
  ['inch', 1],
  ['inches', 1],
  ['ft', 12],
  ['foot', 12],
  ['feet', 12],
  ['yd', 36],
  ['yard', 36],
  ['yards', 36],
  ['mm', 0.0393700787],
  ['millimeter', 0.0393700787],
  ['millimeters', 0.0393700787],
  ['cm', 0.3937007874],
  ['centimeter', 0.3937007874],
  ['centimeters', 0.3937007874],
  ['m', 39.37007874],
  ['meter', 39.37007874],
  ['meters', 39.37007874],
]);

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function unitTokens(measurement) {
  return [measurement?.uom?.symbol, measurement?.uom?.name]
    .map((value) => String(value ?? '').trim().toLowerCase().replace(/\./g, ''))
    .filter(Boolean);
}

function convertMeasurement(measurement, factors) {
  const value = positiveNumber(measurement?.value);
  if (value == null) return null;
  for (const token of unitTokens(measurement)) {
    const factor = factors.get(token);
    if (factor) return Number((value * factor).toFixed(6));
  }
  return null;
}

export function measurementToOunces(measurement) {
  return convertMeasurement(measurement, MASS_TO_OUNCES);
}

export function measurementToInches(measurement) {
  return convertMeasurement(measurement, LENGTH_TO_INCHES);
}

function dimensionsFromOrgSettings(orgSettings) {
  const length = positiveNumber(orgSettings?.defaultLengthIn);
  const width = positiveNumber(orgSettings?.defaultWidthIn);
  const height = positiveNumber(orgSettings?.defaultHeightIn);
  return length != null && width != null && height != null
    ? { length, width, height, unit: 'inch' }
    : null;
}

function dimensionsFromContainer(container) {
  const length = measurementToInches(container?.packageLength);
  const width = measurementToInches(container?.packageWidth);
  const height = measurementToInches(container?.packageHeight);
  return length != null && width != null && height != null
    ? { length, width, height, unit: 'inch' }
    : null;
}

export function packageFromOrgSettings(orgSettings) {
  const weightOz = positiveNumber(orgSettings?.defaultWeightOz) ?? DEFAULT_WEIGHT_OZ;
  const pkg = {
    package_code: 'package',
    weight: { value: weightOz, unit: 'ounce' },
  };
  const dimensions = dimensionsFromOrgSettings(orgSettings);
  if (dimensions) pkg.dimensions = dimensions;
  return pkg;
}

export function packageFromDigitContainer(container, orgSettings) {
  const fallback = packageFromOrgSettings(orgSettings);
  const packageId = String(container?.id ?? '').trim();
  const pkg = {
    package_code: 'package',
    weight: {
      value: measurementToOunces(container?.packageGrossWeight) ?? fallback.weight.value,
      unit: 'ounce',
    },
  };
  if (packageId) pkg.external_package_id = packageId;
  const dimensions = dimensionsFromContainer(container) ?? fallback.dimensions;
  if (dimensions) pkg.dimensions = dimensions;
  return pkg;
}

export function packagesFromDigitShipment(shipment, orgSettings) {
  const containers = shipment?.packContainers ?? [];
  return containers.length > 0
    ? containers.map((container) => packageFromDigitContainer(container, orgSettings))
    : [packageFromOrgSettings(orgSettings)];
}

export function v1PackageFieldsFromDigitContainer(container, orgSettings) {
  const pkg = packageFromDigitContainer(container, orgSettings);
  return {
    packageCode: 'package',
    weight: { value: pkg.weight.value, units: 'ounces' },
    ...(pkg.dimensions
      ? {
          dimensions: {
            length: pkg.dimensions.length,
            width: pkg.dimensions.width,
            height: pkg.dimensions.height,
            units: 'inches',
          },
        }
      : {}),
  };
}
