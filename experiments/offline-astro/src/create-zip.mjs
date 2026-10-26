const textEncoder = new TextEncoder();
const utf8Flag = 0x0800;
const crcTable = new Uint32Array(256);

for (let n = 0; n < crcTable.length; n++) {
  let value = n;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  crcTable[n] = value >>> 0;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function write16(view, offset, value) {
  view.setUint16(offset, value, true);
}

function write32(view, offset, value) {
  view.setUint32(offset, value, true);
}

function join(parts, totalLength) {
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

async function toBytes(value) {
  if (typeof value === "string") return textEncoder.encode(value);
  if (value instanceof Uint8Array) return value;
  if (value instanceof Blob) return new Uint8Array(await value.arrayBuffer());
  throw new TypeError("ZIP entries must be strings or Uint8Array values.");
}

function validateName(name) {
  if (typeof name !== "string" || name === "" || name.startsWith("/") || name.includes("\\") || name.includes("\0")) {
    throw new TypeError(`Unsafe ZIP entry path: ${name}`);
  }
  if (name.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new TypeError(`Unsafe ZIP entry path: ${name}`);
  }
}

/** Create a small uncompressed ZIP archive with UTF-8 file names. */
export async function createZip(files) {
  if (!(files instanceof Map) || files.size === 0 || files.size > 0xffff) {
    throw new TypeError("Provide between 1 and 65,535 files to archive.");
  }

  const localParts = [];
  const centralParts = [];
  let localSize = 0;
  let centralSize = 0;

  for (const [name, source] of files) {
    validateName(name);
    const nameBytes = textEncoder.encode(name);
    const data = await toBytes(source);
    if (nameBytes.byteLength > 0xffff || data.byteLength > 0xffffffff) {
      throw new RangeError(`ZIP entry is too large: ${name}`);
    }
    const crc = crc32(data);

    const localHeader = new Uint8Array(30);
    const localView = new DataView(localHeader.buffer);
    write32(localView, 0, 0x04034b50);
    write16(localView, 4, 20);
    write16(localView, 6, utf8Flag);
    write16(localView, 8, 0);
    write16(localView, 10, 0);
    write16(localView, 12, 0x0021);
    write32(localView, 14, crc);
    write32(localView, 18, data.byteLength);
    write32(localView, 22, data.byteLength);
    write16(localView, 26, nameBytes.byteLength);
    write16(localView, 28, 0);
    localParts.push(localHeader, nameBytes, data);

    const centralHeader = new Uint8Array(46);
    const centralView = new DataView(centralHeader.buffer);
    write32(centralView, 0, 0x02014b50);
    write16(centralView, 4, 20);
    write16(centralView, 6, 20);
    write16(centralView, 8, utf8Flag);
    write16(centralView, 10, 0);
    write16(centralView, 12, 0);
    write16(centralView, 14, 0x0021);
    write32(centralView, 16, crc);
    write32(centralView, 20, data.byteLength);
    write32(centralView, 24, data.byteLength);
    write16(centralView, 28, nameBytes.byteLength);
    write16(centralView, 30, 0);
    write16(centralView, 32, 0);
    write16(centralView, 34, 0);
    write16(centralView, 36, 0);
    write32(centralView, 38, 0);
    write32(centralView, 42, localSize);
    centralParts.push(centralHeader, nameBytes);

    localSize += localHeader.byteLength + nameBytes.byteLength + data.byteLength;
    centralSize += centralHeader.byteLength + nameBytes.byteLength;
    if (localSize > 0xffffffff || centralSize > 0xffffffff) throw new RangeError("ZIP64 archives are not supported.");
  }

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  write32(endView, 0, 0x06054b50);
  write16(endView, 4, 0);
  write16(endView, 6, 0);
  write16(endView, 8, files.size);
  write16(endView, 10, files.size);
  write32(endView, 12, centralSize);
  write32(endView, 16, localSize);
  write16(endView, 20, 0);

  return join([...localParts, ...centralParts, end], localSize + centralSize + end.byteLength);
}
