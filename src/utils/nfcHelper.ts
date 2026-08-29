// Web NFC API helper with fallback emulator
export interface NfcScanResult {
  serialNumber: string;
  records: Array<{
    recordType: string;
    data: string;
  }>;
}

export async function scanNfcTag(): Promise<NfcScanResult> {
  if ('NDEFReader' in window) {
    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();
      return new Promise((resolve, reject) => {
        ndef.onreading = (event: any) => {
          const serialNumber = event.serialNumber || `NFC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          const records: any[] = [];
          for (const record of event.message.records) {
            const textDecoder = new TextDecoder(record.encoding);
            records.push({
              recordType: record.recordType,
              data: textDecoder.decode(record.data),
            });
          }
          resolve({ serialNumber, records });
        };
        ndef.onreadingerror = () => {
          reject(new Error('NFC 讀取失敗，請重新靠近標籤。'));
        };
      });
    } catch (error: any) {
      throw new Error(`NFC 掃描未啟動: ${error.message || error}`);
    }
  } else {
    // Simulated NFC for preview / non-supported devices
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockSerial = `KAO-NFC-${Math.floor(1000 + Math.random() * 9000)}`;
        resolve({
          serialNumber: mockSerial,
          records: [
            {
              recordType: 'text',
              data: JSON.stringify({ app: 'KaoSmartButler', tagId: mockSerial }),
            },
          ],
        });
      }, 1200);
    });
  }
}

export async function writeNfcTag(itemOrLocationId: string, name: string): Promise<boolean> {
  if ('NDEFReader' in window) {
    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [
          {
            recordType: 'text',
            data: JSON.stringify({
              app: '高家智能管家',
              id: itemOrLocationId,
              name,
              time: new Date().toISOString(),
            }),
          },
        ],
      });
      return true;
    } catch (e: any) {
      console.warn('NFC write error:', e);
      return false;
    }
  } else {
    // Emulated success
    await new Promise((r) => setTimeout(r, 1000));
    return true;
  }
}
