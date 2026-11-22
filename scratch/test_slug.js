function cleanProductSlug(rawSlug) {
  if (!rawSlug) return '';
  let str = decodeURIComponent(rawSlug);

  // Separate attached words e.g. "ColorFit" -> "Color Fit", "PiggyToy" -> "Piggy Toy"
  // but protect known brand prefixes if single/double letter like iPhone, boAt
  str = str.replace(/([a-z]{2,})([A-Z][a-z]+)/g, '$1 $2');

  // Separate attached letters and numbers: e.g. "toy20cm" -> "toy 20 cm", "iPhone15" -> "iPhone 15"
  str = str.replace(/([a-zA-Z]+)(\d+)/g, '$1 $2');
  str = str.replace(/(\d+)([a-zA-Z]+)/g, '$1 $2');

  // Replace delimiters with spaces
  str = str.replace(/[-_+/.]/g, ' ');

  // Clean whitespace
  return str.replace(/\s+/g, ' ').trim();
}

console.log('1:', cleanProductSlug('SCOOBA-Fabric-Piggy-toy20cm-Height'));
console.log('2:', cleanProductSlug('Noise-Colorfit-Pulse-Smartwatch-Monitoring'));
console.log('3:', cleanProductSlug('boAt-Rockerz-450-Wireless-Bluetooth-Earphone40mm'));
console.log('4:', cleanProductSlug('Apple-iPhone15Pro-Max-256GB'));
