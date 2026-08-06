{/* =====================================================
    IMAGES
    ===================================================== */}

{post.imageUrls &&
  post.imageUrls.length > 0 && (
    <div
      className={`mb-4 grid gap-2 ${
        post.imageUrls.length === 1
          ? 'grid-cols-1'
          : 'grid-cols-2'
      }`}
    >
      {post.imageUrls.map(
        (imageUrl, index) => (
          <button
            key={`${imageUrl}-${index}`}
            type="button"
            onClick={() => {
              window.open(
                imageUrl,
                '_blank',
                'noopener,noreferrer'
              );
            }}
            className={`relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-indigo-500 group ${
              post.imageUrls?.length === 1
                ? 'max-h-[520px]'
                : 'aspect-square'
            }`}
            title="Klik untuk melihat gambar"
          >
            <img
              src={imageUrl}
              alt={`Gambar postingan ${
                index + 1
              }`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              onError={(e) => {
                console.error(
                  '[mbudiary] Gagal memuat gambar:',
                  imageUrl
                );

                e.currentTarget.style.display =
                  'none';
              }}
            />

            {/* subtle hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
          </button>
        )
      )}
    </div>
  )}