# Importing the necessary packages
from sklearn.preprocessing import LabelBinarizer
from sklearn.preprocessing import MinMaxScaler
import pandas as pd
import numpy as np
import glob
import cv2 as cv
import os


def load_pictures_attributes(inputPath):
	# initialize the list of column names in the CSV file and then
	# load it using Pandas
	cols = ["dir", "total_likes", "photo_username", "username_followers", "success_ratio"]
	df = pd.read_csv(inputPath, sep=" ", header=None, names=cols)

	# AS OF RIGHT NOW DON'T NEED THIS SINCE WE TAKE A LOT FROM EACH PAGE
	# return the data frame
	return df



def load_house_images(df, inputPath):
	# initialize our images array (i.e., the house images themselves)
	images = []

	# loop over the indexes of the houses
	images_dirs = df["dir"].value_counts().keys().tolist()
	for im_dir in images_dirs:
		im_dir = "D:/statispic2" + im_dir[1:] #The right dir
		image = cv.imread(im_dir)
		image = cv.resize(image, (400,400)) #Try this for better results
		# cv.imshow('sample image', image) #for showing the image
		# cv.waitKey(0)
		images.append(image)


	# return our set of images
	return np.array(images)


#df = load_pictures_attributes("D:/statispic2/Photos/statispicData.txt")