declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type: string; quality: number };
    html2canvas?: { scale?: number; useCORS?: boolean };
    jsPDF?: { unit: string; format: string; orientation: string };
    pagebreak?: { mode?: string[] };
  }

  interface Html2Pdf {
    set(options: Html2PdfOptions): this;
    from(element: HTMLElement): this;
    save(): Promise<void>;
  }

  function html2pdf(): Html2Pdf;

  export = html2pdf;
}
