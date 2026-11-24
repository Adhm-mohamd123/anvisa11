import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Printer, Search } from 'lucide-react';
import { fetchCosmeticById } from '../services/cosmeticsService';
import { formatErrorPT } from '../lib/firebase';
import {
  formatDateBR,
  type CosmeticProduct,
  type RegistrationStatus,
} from '../types/cosmetic';
import { ProductThumbnail } from './ProductThumbnail';

interface ProductDetailViewProps {
  productId: string;
  initialProduct?: CosmeticProduct | null;
  onBack: () => void;
}

const COUNTRY_PT_BR: Record<string, string> = {
  brazil: 'Brasil',
  brasil: 'Brasil',
  'united states': 'Estados Unidos',
  usa: 'Estados Unidos',
  us: 'Estados Unidos',
  france: 'França',
  italy: 'Itália',
  germany: 'Alemanha',
  spain: 'Espanha',
  'united kingdom': 'Reino Unido',
  uk: 'Reino Unido',
  egypt: 'Egito',
  japan: 'Japão',
  'south korea': 'Coreia do Sul',
  morocco: 'Marrocos',
  switzerland: 'Suíça',
};

function localizeCountryPTBR(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'Brasil';
  return COUNTRY_PT_BR[trimmed.toLowerCase()] ?? trimmed;
}

function localizeManufacturerPTBR(raw: string): string {
  return raw.replace(/\s+and\s+/gi, ' e ');
}

function localizeDescriptionPTBR(raw?: string): string {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) return 'PRODUTO COSMÉTICO REGULARIZADO';

  const normalized = trimmed
    .replace(/[—–-]/g, '-')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  if (
    normalized === 'treatment - professional hair care product.' ||
    normalized === 'treatment - professional hair care product'
  ) {
    return 'Tratamento – Produto Profissional para Cuidados Capilares.';
  }

  const replacements: [RegExp, string][] = [
    [
      /\bProfessional Hair Care Product\b/gi,
      'Produto Profissional para Cuidados Capilares',
    ],
    [/\bHair Care Product\b/gi, 'Produto para Cuidados Capilares'],
    [/\bCosmetic Product\b/gi, 'Produto Cosmético'],
    [/\bHair Treatment\b/gi, 'Tratamento Capilar'],
    [/\bHair Mask\b/gi, 'Máscara Capilar'],
    [/\bProfessional Use\b/gi, 'Uso Profissional'],
    [/\bMade in Brazil\b/gi, 'Fabricado no Brasil'],
    [/\bTreatment\b/gi, 'Tratamento'],
    [/\bConditioner\b/gi, 'Condicionador'],
    [/\bMoisturizing\b/gi, 'Hidratante'],
    [/\bNourishing\b/gi, 'Nutritivo'],
    [/\bSmoothing\b/gi, 'Alisamento'],
    [/\bKeratin\b/gi, 'Queratina'],
    [/\bOrganic\b/gi, 'Orgânico'],
  ];

  return replacements.reduce(
    (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
    trimmed
  );
}

function getStatusDisplay(status: RegistrationStatus): {
  productSituation: string;
  presentationRegistry: string;
  petitionSubject: string;
  petitionSituation: string;
} {
  switch (status) {
    case 'valid':
      return {
        productSituation: 'ATIVO',
        presentationRegistry: 'Deferido',
        petitionSubject: 'REG. COSMÉTICOS - Registro de Produto',
        petitionSituation: 'Deferido / Aditado ao processo',
      };
    case 'expired':
      return {
        productSituation: 'INATIVO / VENCIDO',
        presentationRegistry: 'Vencido',
        petitionSubject: 'REG. COSMÉTICOS - Validade de Registro',
        petitionSituation: 'Registro vencido',
      };
    case 'suspended':
      return {
        productSituation: 'SUSPENSO',
        presentationRegistry: 'Suspenso',
        petitionSubject: 'REG. COSMÉTICOS - Situação Cadastral',
        petitionSituation: 'Registro suspenso',
      };
  }
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  initialProduct = null,
  onBack,
}) => {
  const [product, setProduct] = useState<CosmeticProduct | null>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'cnpj' | 'process' | null>(null);
  const [showPresentationDetail, setShowPresentationDetail] = useState(false);
  const [showPetitionDetail, setShowPetitionDetail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (initialProduct && initialProduct.id === productId) {
      setProduct(initialProduct);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    setShowPresentationDetail(false);
    setShowPetitionDetail(false);

    fetchCosmeticById(productId)
      .then((item) => {
        if (!cancelled) {
          setProduct(item);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (!initialProduct) {
            setError(
              formatErrorPT(
                err,
                'Não foi possível recuperar os detalhes deste registro.'
              )
            );
          }
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId, initialProduct]);

  const handleCopyCode = async (value: string, field: 'cnpj' | 'process') => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => {
        setCopiedField((prev) => (prev === field ? null : prev));
      }, 1800);
    } catch {
      // Clipboard unavailable in restricted context
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="border border-[#cfcfcf] rounded-[2px] bg-white overflow-hidden">
          <div className="h-9 bg-[#f2f2f2] border-b border-[#cfcfcf]" />
          <div className="p-4 space-y-2.5">
            <div className="h-7 bg-[#f5f5f5] animate-pulse" />
            <div className="h-7 bg-[#f5f5f5] animate-pulse" />
            <div className="h-7 bg-[#f5f5f5] animate-pulse" />
            <div className="h-12 bg-[#f5f5f5] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product || !product.verifiedByAdmin) {
    return (
      <section className="border border-[#cfcfcf] rounded-[2px] bg-white p-8 text-center hc-surface">
        <AlertCircle
          className="w-10 h-10 text-[#b91c1c] mx-auto mb-3"
          aria-hidden="true"
        />
        <h2 className="text-[16px] font-bold text-[#333333]">
          Registro não encontrado ou não verificado
        </h2>
        <p className="text-[13px] text-[#555555] max-w-lg mx-auto mt-1.5">
          {error
            ? error
            : 'O produto solicitado não foi localizado ou não possui validação administrativa na base de dados.'}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-[#333333] bg-white hover:bg-[#eeeeee] border border-[#cccccc] rounded-[2px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Voltar</span>
        </button>
      </section>
    );
  }

  const companyName = localizeManufacturerPTBR(product.manufacturerName).toUpperCase();
  const productNameUpper = product.productName.toUpperCase();
  const categoryUpper = localizeDescriptionPTBR(product.description).toUpperCase();
  const originCountryPT = localizeCountryPTBR(product.originCountry);
  const statusDisplay = getStatusDisplay(product.status);
  const hasImage = Boolean(product.hasUploadedImage || product.imageUrl.trim());

  return (
    <div className="space-y-5">
      {/* Panel 1: Detalhes do Produto */}
      <section
        aria-labelledby="detalhes-produto-heading"
        className="border border-[#cfcfcf] rounded-[2px] bg-white overflow-hidden hc-surface"
      >
        <div className="bg-[#f2f2f2] border-b border-[#cfcfcf] py-2.5 px-4 text-center hc-header-bar">
          <h2
            id="detalhes-produto-heading"
            className="text-[13px] font-normal text-[#444444]"
          >
            Detalhes do Produto
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[12.5px] leading-[1.45]">
            <tbody>
              {/* Row 1: Nome da Empresa */}
              <tr>
                <th className="w-[19%] bg-[#f5f5f5] text-[#333333] font-bold text-left px-3 py-2 border-b border-r border-[#dcdcdc] align-middle hc-surface">
                  Nome da Empresa
                </th>
                <td
                  colSpan={3}
                  className="bg-white text-[#444444] px-3 py-2 border-b border-[#dcdcdc] align-middle hc-surface"
                >
                  {companyName}
                </td>
              </tr>

              {/* Row 2: Número do CNPJ da Empresa | Autorização */}
              <tr>
                <th className="w-[19%] bg-[#f5f5f5] text-[#333333] font-bold text-left px-3 py-2 border-b border-r border-[#dcdcdc] align-middle hc-surface">
                  Número do CNPJ da Empresa
                </th>
                <td className="w-[41%] bg-white px-3 py-2 border-b border-r border-[#dcdcdc] align-middle hc-surface">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(product.snbNumber, 'cnpj')}
                    title="Copiar CNPJ / SNB"
                    className="inline-flex items-center gap-1.5 text-[#1b5ca7] hover:underline tabular-nums cursor-pointer text-left hc-link"
                  >
                    <span>{product.snbNumber}</span>
                    {copiedField === 'cnpj' && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-[#166534] font-medium">
                        <Check className="w-3 h-3" aria-hidden="true" />
                        Copiado
                      </span>
                    )}
                  </button>
                </td>
                <th className="w-[17%] bg-[#f5f5f5] text-[#333333] font-bold text-left px-3 py-2 border-b border-r border-[#dcdcdc] align-middle hc-surface">
                  Autorização
                </th>
                <td className="w-[23%] bg-white text-[#444444] text-center px-3 py-2 border-b border-[#dcdcdc] tabular-nums align-middle hc-surface">
                  {product.registrationNumber}
                </td>
              </tr>

              {/* Row 3: Produto */}
              <tr>
                <th className="bg-[#f5f5f5] text-[#333333] font-bold text-left px-3 py-2 border-b border-r border-[#dcdcdc] align-middle hc-surface">
                  Produto
                </th>
                <td
                  colSpan={3}
                  className="bg-white text-[#444444] px-3 py-2 border-b border-[#dcdcdc] align-middle hc-surface"
                >
                  {productNameUpper}
                </td>
              </tr>

              {/* Row 4: Categoria */}
              <tr>
                <th className="bg-[#f5f5f5] text-[#333333] font-bold text-left px-3 py-2 border-b border-r border-[#dcdcdc] align-top hc-surface">
                  Categoria
                </th>
                <td
                  colSpan={3}
                  className="bg-white text-[#444444] px-3 py-2 border-b border-[#dcdcdc] whitespace-pre-line align-middle hc-surface"
                >
                  {categoryUpper}
                </td>
              </tr>

              {/* Row 5: Processo */}
              <tr>
                <th className="bg-[#f5f5f5] text-[#333333] font-bold text-left px-3 py-2 border-b border-r border-[#dcdcdc] align-middle hc-surface">
                  Processo
                </th>
                <td
                  colSpan={3}
                  className="bg-white px-3 py-2 border-b border-[#dcdcdc] align-middle hc-surface"
                >
                  <button
                    type="button"
                    onClick={() => handleCopyCode(product.processNumber, 'process')}
                    title="Copiar número do processo"
                    className="inline-flex items-center gap-1.5 text-[#1b5ca7] hover:underline tabular-nums cursor-pointer text-left hc-link"
                  >
                    <span>{product.processNumber}</span>
                    {copiedField === 'process' && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-[#166534] font-medium">
                        <Check className="w-3 h-3" aria-hidden="true" />
                        Copiado
                      </span>
                    )}
                  </button>
                </td>
              </tr>

              {/* Row 6: Publicação do Registro */}
              <tr>
                <th className="bg-[#f5f5f5] text-[#333333] font-bold text-left px-3 py-2 border-b border-r border-[#dcdcdc] align-middle hc-surface">
                  Publicação do Registro
                </th>
                <td
                  colSpan={3}
                  className="bg-white text-[#444444] px-3 py-2 border-b border-[#dcdcdc] tabular-nums align-middle hc-surface"
                >
                  {formatDateBR(product.registrationDate)}
                </td>
              </tr>

              {/* Row 7: Vencimento do Registro */}
              <tr>
                <th className="bg-[#f5f5f5] text-[#333333] font-bold text-left px-3 py-2 border-b border-r border-[#dcdcdc] align-middle hc-surface">
                  Vencimento do Registro
                </th>
                <td
                  colSpan={3}
                  className="bg-white text-[#444444] px-3 py-2 border-b border-[#dcdcdc] tabular-nums align-middle hc-surface"
                >
                  {formatDateBR(product.expirationDate)}
                </td>
              </tr>

              {/* Row 8: Situação do Produto */}
              <tr>
                <th className="bg-[#f5f5f5] text-[#333333] font-bold text-left px-3 py-2 border-r border-[#dcdcdc] align-middle hc-surface">
                  Situação do Produto
                </th>
                <td
                  colSpan={3}
                  className="bg-white text-[#444444] px-3 py-2 align-middle hc-surface"
                >
                  {statusDisplay.productSituation}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Panel 2: Apresentação / Registro / Tonalidade */}
      <section
        aria-label="Apresentação do produto"
        className="border border-[#cfcfcf] rounded-[2px] bg-white overflow-hidden hc-surface"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[12.5px] leading-[1.45]">
            <thead>
              <tr className="bg-[#f2f2f2] text-[#333333] font-bold hc-header-bar">
                <th className="w-[82px] py-2 px-3 text-right border-b border-r border-[#dcdcdc]">
                  Nº
                </th>
                <th className="py-2 px-3 text-left border-b border-r border-[#dcdcdc]">
                  Apresentação
                </th>
                <th className="w-[155px] py-2 px-3 text-center border-b border-r border-[#dcdcdc]">
                  Registro
                </th>
                <th className="w-[235px] py-2 px-3 text-left border-b border-[#dcdcdc]">
                  Tonalidade
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#f9f9f9] text-[#444444] hc-surface">
                <td className="py-2.5 px-3 border-r border-[#dcdcdc] align-middle">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPresentationDetail((prev) => !prev)}
                      aria-expanded={showPresentationDetail}
                      aria-label="Visualizar detalhes da apresentação"
                      title="Detalhes da apresentação"
                      className="p-0.5 text-[#333333] hover:text-[#1b5ca7] cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <span className="tabular-nums">1</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 border-r border-[#dcdcdc] align-middle">
                  <span>{productNameUpper} - Primária </span>
                  <strong className="font-bold text-[#333333]">
                    ORIGEM: {originCountryPT.toUpperCase()}
                  </strong>
                </td>
                <td className="py-2.5 px-3 text-center border-r border-[#dcdcdc] align-middle">
                  {statusDisplay.presentationRegistry}
                </td>
                <td className="py-2.5 px-3 align-middle">
                  Não se aplica para essa categoria
                </td>
              </tr>

              {showPresentationDetail && (
                <tr className="bg-white text-[#444444] hc-surface">
                  <td
                    colSpan={4}
                    className="p-3.5 border-t border-[#dcdcdc]"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {hasImage && (
                        <ProductThumbnail
                          productId={product.id}
                          productName={product.productName}
                          imageUrl={product.imageUrl}
                          hasUploadedImage={product.hasUploadedImage}
                          className="w-20 h-20 shrink-0"
                        />
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-[12px] flex-1">
                        <div>
                          <span className="font-bold text-[#333333] block">
                            País de Origem
                          </span>
                          <span>{originCountryPT}</span>
                        </div>
                        <div>
                          <span className="font-bold text-[#333333] block">
                            Número do Registro
                          </span>
                          <span className="tabular-nums">
                            {product.registrationNumber}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-[#333333] block">
                            Vigência
                          </span>
                          <span className="tabular-nums">
                            {formatDateBR(product.registrationDate)} a{' '}
                            {formatDateBR(product.expirationDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Panel 3: Petições + Footer Voltar Button */}
      <section
        aria-labelledby="peticoes-heading"
        className="border border-[#cfcfcf] rounded-[2px] bg-white overflow-hidden hc-surface"
      >
        <div className="bg-[#f2f2f2] border-b border-[#cfcfcf] py-2 px-4 text-center hc-header-bar">
          <h3
            id="peticoes-heading"
            className="text-[13px] font-normal text-[#444444]"
          >
            Petições
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[12.5px] leading-[1.45]">
            <thead>
              <tr className="bg-[#f2f2f2] text-[#333333] font-bold hc-header-bar">
                <th className="w-[165px] py-2 px-3 text-center border-b border-r border-[#dcdcdc]">
                  Expediente
                </th>
                <th className="w-[145px] py-2 px-3 text-center border-b border-r border-[#dcdcdc]">
                  Data da Publicação
                </th>
                <th className="w-[140px] py-2 px-3 text-center border-b border-r border-[#dcdcdc]">
                  Transação
                </th>
                <th className="py-2 px-3 text-left border-b border-r border-[#dcdcdc]">
                  Assunto
                </th>
                <th className="w-[195px] py-2 px-3 text-left border-b border-[#dcdcdc]">
                  Situação
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#f9f9f9] text-[#444444] hc-surface">
                <td className="py-2.5 px-3 border-r border-[#dcdcdc] align-middle">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPetitionDetail((prev) => !prev)}
                      aria-expanded={showPetitionDetail}
                      aria-label="Visualizar detalhes da petição"
                      title="Detalhes da petição"
                      className="p-0.5 text-[#333333] hover:text-[#1b5ca7] cursor-pointer shrink-0"
                    >
                      <Search className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <span className="tabular-nums">
                      999132/66-4
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums border-r border-[#dcdcdc] align-middle" />
                <td className="py-2.5 px-3 text-center tabular-nums border-r border-[#dcdcdc] align-middle" />
                <td className="py-2.5 px-3 border-r border-[#dcdcdc] align-middle">
                  {statusDisplay.petitionSubject}
                </td>
                <td className="py-2.5 px-3 align-middle">
                  {statusDisplay.petitionSituation}
                </td>
              </tr>

              {showPetitionDetail && (
                <tr className="bg-white text-[#444444] hc-surface">
                  <td
                    colSpan={5}
                    className="p-3.5 border-t border-[#dcdcdc] text-[12px]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div>
                          <strong className="text-[#333333]">Empresa: </strong>
                          <span>{companyName}</span>
                        </div>
                        <div>
                          <strong className="text-[#333333]">Processo: </strong>
                          <span className="tabular-nums">{product.processNumber}</span>
                          <span className="mx-2 text-[#aaaaaa]">·</span>
                          <strong className="text-[#333333]">Situação: </strong>
                          <span>{statusDisplay.productSituation}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] text-[#333333] bg-white hover:bg-[#eeeeee] border border-[#cccccc] rounded-[2px] cursor-pointer no-print"
                      >
                        <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Imprimir</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom footer strip inside Petições matching screenshot Voltar button */}
        <div className="bg-[#f2f2f2] border-t border-[#d2d6dc] px-4 py-2.5 flex items-center justify-end no-print hc-header-bar">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-1 text-[12.5px] font-normal text-[#333333] bg-white hover:bg-[#e9ecef] border border-[#cccccc] rounded-[3px] transition-colors cursor-pointer"
          >
            Voltar
          </button>
        </div>
      </section>
    </div>
  );
};
