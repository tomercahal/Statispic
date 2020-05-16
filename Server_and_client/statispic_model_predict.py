# USAGE
# python load_model.py --images malaria/testing --model saved_model.model

# import the necessary packages
from keras.preprocessing.image import img_to_array
from keras.optimizers import Adam
from keras.models import load_model
from datasets import *
from models import *
import numpy as np
import argparse
import random
import cv2 as cv
import sys

BEST_WEIGHTS_DIR = "D:/Statispic2/try-best-weights.hdf5"

def load_images_for_trained_model(list_of_dirs):
	# initialize our images array (i.e., the house images themselves)
	images = []

	# loop over the indexes of the houses
	for im_dir in list_of_dirs:
		print(im_dir)
		image = cv.imread(im_dir)
		image = cv.resize(image, (400,400)) #Try this for better results
		# cv.imshow('sample image', image) #for showing the image
		# cv.waitKey(0)
		images.append(image)

	# return our set of images
	return np.array(images)


# Load all the dirs provided as args for pictures
print("yessir")
print(len(sys.argv))
#all_image_dirs = [sys.argv[i+1] for i in range(len(sys.argv)-1)] # for calling with python
all_image_dirs = str(sys.argv[1]).split(" ") # for calling with node.js
print(all_image_dirs)
images_ready_for_prediction = load_images_for_trained_model(all_image_dirs)
images_ready_for_prediction = images_ready_for_prediction / 255.0  #normalizing
# load the pre-trained network
print("[INFO] loading pre-trained network...")
# model = create_cnn(400, 400, 3, regress=True)
# opt = Adam(lr=1e-3, decay=1e-3 / 200)  # Trying to load weights 
# model.load_weights(BEST_WEIGHTS_DIR)
# model.compile(loss="mean_absolute_percentage_error", optimizer=opt)

model = load_model("D:/statispic2/final-statispic_model.hdf5")  # Loading the model
print("Successfully loaded the model with the weights provided!")

prediction = model.predict(images_ready_for_prediction)
print(prediction)
prediction_mul_list = prediction.tolist()
prediction_list = [val for sublist in prediction_mul_list for val in sublist]
print(prediction_list)
for i in range(len(all_image_dirs)):
	print("X(image dir)=%s, Predicted value=%s" % (all_image_dirs[i], prediction[i]))
best_image_dir = all_image_dirs[prediction_list.index(max(prediction_list))]
print("The best image is: " + best_image_dir + " !!!!")
sys.stdout.flush()
	#Later on sort the photos and return with sys.flush or something like that