import cv2
import pickle
import numpy as np


# Class containing a configuration of histograms for a quant level
class HistogramConfig:
    # so here we have the default parameters for the testing class
    # otherwise we siply take the passed parameters
    # this is defined as the instance variable
    def __init__(self, foregroundHist, ratioHist, quantLevel = 32):

        self.foregroundHist = foregroundHist
        self.ratioHist = ratioHist
        self.quantLevel = quantLevel


# here we want to be able to find the bounding boxes based on the binary image
# x,y,w,h = cv2.boundingRect(cnt) where (x, y) is top - left point and (w, h) is the width and height
def createBoundingBoxes(img, original_image_path):
    # first argument - source image, second argument -  contours to be drawn as a python list
    # 3rd argument index of contours
    # remaining arguments - colour and thickness
    # cv2.drawContours(original_img, [rectangle], -1, (0, 0, 255), 3)
    # Contours contains the rough co-ordinates of our contours.
    contours = cv2.findContours(img, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)[0]

    original_img = cv2.imread(original_image_path, cv2.IMREAD_COLOR)

    num_contours = len(contours)

    mean_area = 0

    for i in range(0, num_contours):

        mean_area += cv2.contourArea(contours[i])

    mean_area = mean_area/num_contours

    # way of going through each contour

    for i in range(0, num_contours):
        if not(smallCountourCheck(contours[i], mean_area)):
            x, y, w, h = cv2.boundingRect(contours[i])
            rectangle = cv2.rectangle(original_img, (x,y), (x+w, y+h), (0, 0, 255), 5)


    cv2.namedWindow("output", cv2.WINDOW_NORMAL)
    newImg = cv2.resize(rectangle, (6048, 4032))
    cv2.imshow("output", newImg)
    cv2.waitKey(0)

# method to remove very small contour
def smallCountourCheck(c, mean):

    return cv2.contourArea(c) < (0.2 * mean)



# function to perform opening and closing
# might need to use a different structuring element ?
def performOpeningClosing(logicalImg):

    firstKernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))

    secondKernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (26, 26))

    opening = cv2.morphologyEx(logicalImg, cv2.MORPH_OPEN, firstKernel)

    closing = cv2.morphologyEx(opening, cv2.MORPH_CLOSE, secondKernel)


    #cv2.namedWindow("output", cv2.WINDOW_NORMAL)
    #newImg = cv2.resize(closing, (6048, 4032))
    #cv2.imshow("output", newImg)
    #cv2.waitKey(0)

    return closing



# this function is designed to take a normalised image and the respective histogram object
# needs cleaning up for efficency
# fixed normalisation algorithm
def segmentKrill(normalisedImg,  histogram_object):

    qLevels = histogram_object.quantLevel

    # pre-calculated threshold values
    GENERIC_THRESHOLD = 100.0
    GENERIC_THREHOLD_FOREGROUND = 0.0001

    # logical matrix for segmented image
    logicalImg = cv2.cvtColor(normalisedImg, cv2.COLOR_BGR2GRAY)

    # get the float representation
    # floatRep =  normalisedImg.astype(float)

    # new quantised image
    normalisedImg[:, :, 0] = (normalisedImg[:, :, 0] / 255 * qLevels)
    normalisedImg[:, :, 1] = (normalisedImg[:, :, 1] / 255 * qLevels)
    normalisedImg[:, :, 2] = (normalisedImg[:, :, 2] / 255 * qLevels)

    dimensions_tuple = normalisedImg.shape

    for i in range(0, dimensions_tuple[0]):
        for x in range(0, dimensions_tuple[1]):

            bValue = normalisedImg.item(i, x, 0)
            gValue = normalisedImg.item(i, x, 1)
            rValue = normalisedImg.item(i, x, 2)

            # need to decrement pixel index due to python conventions of starting from 0
            ratioProb = histogram_object.ratioHist['ratioHist32'][rValue-1][gValue-1][bValue-1]
            foregroundProb = histogram_object.foregroundHist['normalisedForeground'][rValue-1][gValue-1][bValue-1]

            if ratioProb > GENERIC_THRESHOLD and foregroundProb > GENERIC_THREHOLD_FOREGROUND:
                logicalImg.itemset((i, x), 255)
            else:
                logicalImg.itemset((i, x), 0)


    #cv2.namedWindow("output", cv2.WINDOW_NORMAL)
    #newImg = cv2.resize(logicalImg, (6048, 4032))
    #cv2.imshow("output", newImg)
    #cv2.waitKey(0)

    return logicalImg



# take an img path and return the read in img
# read in colour image
def read_img(imgPath):

    img = cv2.imread(imgPath, cv2.IMREAD_COLOR)
    cv2.imshow('image', img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    return img

# method to noramlise an image
def img_normalise(imgPath):

    # is read in as B G R
    img = cv2.imread(imgPath, cv2.IMREAD_COLOR)

    # load in the pre-pickled reference RGB array
    # convert to float for later operations
    ref_RGB = scipy.io.loadmat("U:/Documents/MATLAB/KrillExperiments/MeanColourReference")
    ref_colours = ref_RGB['meanColourRef']

    # blue = red, green = green, red = blue
    # this is the extracted colour channels for the image in question
    blue = img[:, :, 0]
    green = img[:, :, 1]
    red = img[:, :, 2]

    green_avg = np.mean(green)
    red_avg = np.mean(red)
    blue_avg = np.mean(blue)

    # for blue channel we essentially need to cap the limit to 255. So must go through manually
    for i in range(0, len(img[:, 1, :])):
        for x in range(0, len(img[1, :, :])):
            # do the following:
            img.itemset((i, x, 0), calculatePixelValue(img.item(i, x, 0), blue_avg, ref_colours[0, 2]))



    # img[:, :, 0] = (blue / blue_avg) * ref_colours[0, 2]

    new_blue = np.clip(blue, 0, 255, out=blue)

    # img[:, :, 0] = new_blue
    img[:, :, 1] = (green / green_avg) * ref_colours[0, 1]
    img[:, :, 2] = (red / red_avg) * ref_colours[0, 0]

    # testing image
   # cv2.namedWindow("output", cv2.WINDOW_NORMAL)
    #newImg = cv2.resize(img, (6048, 4032))
    #cv2.imshow("output", newImg)
    #cv2.waitKey(0)

    return img

# need to manually set yhe value to be 255
def calculatePixelValue(currentPixelValue, avg, ref_colour):

    value = round((currentPixelValue / avg) * ref_colour)
    if value > 255:
        return 255
    else:
        return value


# method to save an item with a filename
def pickle_item(fileName, item2Pickle):

    # write to the objectDump.text file
    with open (fileName, 'wb') as f:
        pickle.dump(item2Pickle, f, pickle.DEFAULT_PROTOCOL)

# method to load an item based on the filepath
def load_item(filePath):

    with open(filePath, 'rb') as f:
        return pickle.load(f)


def main():

    # load in the foreground and ratio histogram classes
    foregroundHist = scipy.io.loadmat("U:/Documents/MATLAB/KrillExperiments\MatLab_Segmentation_Variables/ForegroundHistogram/qLevels32/normalisedForeground32.mat")

    ratioHist = scipy.io.loadmat("U:/Documents/MATLAB/KrillExperiments/MatLab_Segmentation_Variables/RatioHistogram/ratioHistogram32.mat")

    histograms32 = HistogramConfig(foregroundHist, ratioHist, 32)

    newKrillImage = img_normalise('E:/Masters Folder/Masters Year/KrillExperiments/JR255A/Krill Images - Sorted/JR255A_krill_image_1.JPG')

    logical_mask = segmentKrill(newKrillImage, histograms32)

    noiseReducedmask = performOpeningClosing(logical_mask)

    createBoundingBoxes(noiseReducedmask, 'E:/Masters Folder/Masters Year/KrillExperiments/JR255A/Krill Images - Sorted/JR255A_krill_image_1.JPG')


if __name__ == '__main__':
    main()