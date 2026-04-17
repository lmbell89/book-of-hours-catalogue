import Modal from './Modal'
import { SoulsDisplay, TagsDisplay } from './SoulTags'

export default function ItemInfoModal({ item, discovered = true, onClose }) {
  const hasSouls = item.souls && Object.keys(item.souls).length > 0
  const hasProps = item.properties && item.properties.length > 0

  return (
    <Modal title={item.name} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '16rem' }}>
        {!discovered ? (
          <p style={{ color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
            This item has not been discovered yet.
          </p>
        ) : (
          <>
            {hasSouls && <SoulsDisplay souls={item.souls} />}
            {hasProps && <TagsDisplay tags={item.properties} />}
            {!hasSouls && !hasProps && (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No soul or property data.</p>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
