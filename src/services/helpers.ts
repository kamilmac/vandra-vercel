export const encodeQueryParameters = (parameters): string => {
  const parts = [];
  Object.keys(parameters).forEach((key) => {
    if (parameters.hasOwnProperty(key)) {
      parts.push(`${key}=${encodeURIComponent(parameters[key])}`);
    }
  });
  return parts.join('&');
};

export const encodeQuery = (url: string, parameters): string => {
  const parameterString = encodeQueryParameters(parameters);
  if (parameterString) {
    return `${url}?${parameterString}`;
  }
  return url;
};
