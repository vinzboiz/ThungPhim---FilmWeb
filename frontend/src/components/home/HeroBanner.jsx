import { createPortal } from 'react-dom';
import { useHeroBanner } from '../../hooks/useHeroBanner';
import HeroBannerStage from './HeroBannerStage';
import HeroBannerModal from './HeroBannerModal';
import '../../styles/components/hero-banner.css';

function HeroBanner({ externalModalItem = null, onCloseModal, heroType = 'all', modalOnly = false }) {
  const { modalOnly: mOnly, isModalOpen, modalContent, stage, modal } = useHeroBanner({
    externalModalItem,
    onCloseModal,
    heroType,
    modalOnly,
  });

  return (
    <>
      {!mOnly && <HeroBannerStage {...stage} />}
      {isModalOpen && modalContent && createPortal(<HeroBannerModal {...modal} />, document.body)}
    </>
  );
}

export default HeroBanner;
