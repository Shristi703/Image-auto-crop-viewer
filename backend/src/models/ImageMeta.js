import mongoose from 'mongoose';

const ImageMetaSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png', 'image/webp'],
    },
    size: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    aspectRatio: {
      type: String,
      required: true,
      default: 'Custom',
    },
    aspectRatioDecimal: {
      type: Number,
      required: true,
    },
    gridFsFileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

ImageMetaSchema.virtual('fileUrl').get(function () {
  return `/api/images/${this._id}/file`;
});

export const ImageMeta = mongoose.model('ImageMeta', ImageMetaSchema);
